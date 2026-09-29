using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;

namespace ECS;

public class CheckListForm : Form
{
	private CheckBox[] allCB;

	private int Xno;

	private int Yno;

	private int eg_x;

	private int eg_y;

	private IContainer components;

	private Button okButton;

	private Button cancelButton;

	private TableLayoutPanel CL_TableLayoutPanel;

	public void DefaultChecked(bool[] bl)
	{
		for (int i = 0; i < Yno; i++)
		{
			for (int j = 0; j < Xno; j++)
			{
				int num = j + i * Xno;
				if (num < bl.Length)
				{
					allCB[num].Checked = bl[num];
				}
				else
				{
					allCB[num].Checked = false;
				}
			}
		}
	}

	public void DefaultEnabled(bool[] bl)
	{
		for (int i = 0; i < Yno; i++)
		{
			for (int j = 0; j < Xno; j++)
			{
				int num = j + i * Xno;
				if (num < bl.Length)
				{
					allCB[num].Enabled = bl[num];
				}
				else
				{
					allCB[num].Enabled = true;
				}
			}
		}
	}

	public CheckListForm(int Xin, string[] tp, string[] tm)
	{
		InitializeComponent();
		eg_x = CL_TableLayoutPanel.Size.Width;
		eg_y = CL_TableLayoutPanel.Size.Height;
		Text = tm[0];
		okButton.Text = tm[1];
		cancelButton.Text = tm[2];
		Xno = Xin;
		Yno = (tp.Length + Xin - 1) / Xin;
		allCB = new CheckBox[Xno * Yno];
		for (int i = 0; i < Yno; i++)
		{
			for (int j = 0; j < Xno; j++)
			{
				int num = j + i * Xno;
				allCB[num] = new CheckBox();
				allCB[num].Anchor = AnchorStyles.Left;
				allCB[num].Width = eg_x;
				CL_TableLayoutPanel.Controls.Add(allCB[num], j, i);
				if (num < tp.Length)
				{
					allCB[num].Text = tp[num];
					allCB[num].AutoSize = true;
					allCB[num].UseVisualStyleBackColor = true;
					if (allCB[num].Text == "")
					{
						allCB[num].Visible = false;
					}
					else
					{
						allCB[num].Visible = true;
					}
				}
				else
				{
					allCB[num].Visible = false;
				}
			}
		}
	}

	private void CheckListForm_Load(object sender, EventArgs e)
	{
		CL_TableLayoutPanel.Size = new Size(Xno * eg_x, Yno * eg_y);
		base.Size = new Size((Xno - 1) * eg_x + base.Width, (Yno - 1) * eg_y + base.Height);
		for (int i = 1; i < Yno; i++)
		{
			CL_TableLayoutPanel.RowStyles.Add(new RowStyle(SizeType.Absolute, eg_y));
		}
		for (int j = 1; j < Xno; j++)
		{
			CL_TableLayoutPanel.ColumnStyles.Add(new ColumnStyle(SizeType.Absolute, eg_x));
		}
		CL_TableLayoutPanel.RowCount = Yno;
		CL_TableLayoutPanel.ColumnCount = Xno;
		for (int k = 0; k < Yno; k++)
		{
			for (int l = 0; l < Xno; l++)
			{
				int num = l + k * Xno;
				CL_TableLayoutPanel.Controls.Add(allCB[num], l, k);
			}
		}
	}

	public bool Checked(int Xin, int Yin)
	{
		return allCB[Xin + Yin * Xno].Checked;
	}

	public bool Checked(int No)
	{
		return allCB[No].Checked;
	}

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.CL_TableLayoutPanel = new System.Windows.Forms.TableLayoutPanel();
		base.SuspendLayout();
		this.okButton.Anchor = System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		this.okButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.okButton.Location = new System.Drawing.Point(50, 59);
		this.okButton.Name = "okButton";
		this.okButton.Size = new System.Drawing.Size(124, 23);
		this.okButton.TabIndex = 5;
		this.okButton.Text = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.cancelButton.Anchor = System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right;
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.cancelButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.cancelButton.Location = new System.Drawing.Point(50, 88);
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.Size = new System.Drawing.Size(124, 23);
		this.cancelButton.TabIndex = 6;
		this.cancelButton.Text = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.CL_TableLayoutPanel.AutoSize = true;
		this.CL_TableLayoutPanel.ColumnCount = 1;
		this.CL_TableLayoutPanel.ColumnStyles.Add(new System.Windows.Forms.ColumnStyle(System.Windows.Forms.SizeType.Absolute, 150f));
		this.CL_TableLayoutPanel.Location = new System.Drawing.Point(13, 13);
		this.CL_TableLayoutPanel.Name = "CL_TableLayoutPanel";
		this.CL_TableLayoutPanel.RowCount = 1;
		this.CL_TableLayoutPanel.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 25f));
		this.CL_TableLayoutPanel.RowStyles.Add(new System.Windows.Forms.RowStyle(System.Windows.Forms.SizeType.Absolute, 25f));
		this.CL_TableLayoutPanel.Size = new System.Drawing.Size(150, 25);
		this.CL_TableLayoutPanel.TabIndex = 7;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(188, 123);
		base.Controls.Add(this.CL_TableLayoutPanel);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.cancelButton);
		base.Name = "CheckListForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		this.Text = "CheckListForm";
		base.Load += new System.EventHandler(CheckListForm_Load);
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
