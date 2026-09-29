using System;
using System.ComponentModel;
using System.Drawing;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class StartUpForm : Form
{
	private IContainer components;

	private RadioButton Disable_RadioButton;

	private RadioButton Normal_RadioButton;

	private RadioButton CustomFile_RadioButton;

	private RadioButton ExcelFile_RadioButton;

	private CheckBox SystemTray_CheckBox;

	private Button okButton;

	private Button cancelButton;

	private Label passLabel;

	private Label nameLabel;

	public TextBox nameTextBox;

	public TextBox passTextBox;

	private CheckBox Login_CheckBox;

	private CheckBox CloseTray_CheckBox;

	public string target;

	public bool fix;

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
		this.Disable_RadioButton = new System.Windows.Forms.RadioButton();
		this.Normal_RadioButton = new System.Windows.Forms.RadioButton();
		this.CustomFile_RadioButton = new System.Windows.Forms.RadioButton();
		this.ExcelFile_RadioButton = new System.Windows.Forms.RadioButton();
		this.SystemTray_CheckBox = new System.Windows.Forms.CheckBox();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.passLabel = new System.Windows.Forms.Label();
		this.nameLabel = new System.Windows.Forms.Label();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.passTextBox = new System.Windows.Forms.TextBox();
		this.Login_CheckBox = new System.Windows.Forms.CheckBox();
		this.CloseTray_CheckBox = new System.Windows.Forms.CheckBox();
		base.SuspendLayout();
		this.Disable_RadioButton.AutoSize = true;
		this.Disable_RadioButton.Location = new System.Drawing.Point(12, 12);
		this.Disable_RadioButton.Name = "Disable_RadioButton";
		this.Disable_RadioButton.Size = new System.Drawing.Size(71, 16);
		this.Disable_RadioButton.TabIndex = 0;
		this.Disable_RadioButton.TabStop = true;
		this.Disable_RadioButton.Text = "oDisable";
		this.Disable_RadioButton.UseVisualStyleBackColor = true;
		this.Disable_RadioButton.CheckedChanged += new System.EventHandler(Disable_RadioButton_CheckedChanged);
		this.Normal_RadioButton.AutoSize = true;
		this.Normal_RadioButton.Location = new System.Drawing.Point(12, 34);
		this.Normal_RadioButton.Name = "Normal_RadioButton";
		this.Normal_RadioButton.Size = new System.Drawing.Size(113, 16);
		this.Normal_RadioButton.TabIndex = 0;
		this.Normal_RadioButton.TabStop = true;
		this.Normal_RadioButton.Text = "oNormal Startup";
		this.Normal_RadioButton.UseVisualStyleBackColor = true;
		this.CustomFile_RadioButton.AutoSize = true;
		this.CustomFile_RadioButton.Location = new System.Drawing.Point(11, 56);
		this.CustomFile_RadioButton.Name = "CustomFile_RadioButton";
		this.CustomFile_RadioButton.Size = new System.Drawing.Size(143, 16);
		this.CustomFile_RadioButton.TabIndex = 0;
		this.CustomFile_RadioButton.TabStop = true;
		this.CustomFile_RadioButton.Text = "oRunning Custom File";
		this.CustomFile_RadioButton.UseVisualStyleBackColor = true;
		this.ExcelFile_RadioButton.AutoSize = true;
		this.ExcelFile_RadioButton.Location = new System.Drawing.Point(11, 78);
		this.ExcelFile_RadioButton.Name = "ExcelFile_RadioButton";
		this.ExcelFile_RadioButton.Size = new System.Drawing.Size(137, 16);
		this.ExcelFile_RadioButton.TabIndex = 0;
		this.ExcelFile_RadioButton.TabStop = true;
		this.ExcelFile_RadioButton.Text = "oRunning Excel File";
		this.ExcelFile_RadioButton.UseVisualStyleBackColor = true;
		this.SystemTray_CheckBox.AutoSize = true;
		this.SystemTray_CheckBox.Location = new System.Drawing.Point(12, 124);
		this.SystemTray_CheckBox.Name = "SystemTray_CheckBox";
		this.SystemTray_CheckBox.Size = new System.Drawing.Size(168, 16);
		this.SystemTray_CheckBox.TabIndex = 1;
		this.SystemTray_CheckBox.Text = "oMinimize to System Tray";
		this.SystemTray_CheckBox.UseVisualStyleBackColor = true;
		this.okButton.Anchor = System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		this.okButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.okButton.Location = new System.Drawing.Point(85, 270);
		this.okButton.Name = "okButton";
		this.okButton.Size = new System.Drawing.Size(124, 23);
		this.okButton.TabIndex = 7;
		this.okButton.Text = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.cancelButton.Anchor = System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Right;
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.cancelButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.cancelButton.Location = new System.Drawing.Point(228, 270);
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.Size = new System.Drawing.Size(124, 23);
		this.cancelButton.TabIndex = 8;
		this.cancelButton.Text = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.passLabel.AutoSize = true;
		this.passLabel.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.passLabel.Location = new System.Drawing.Point(48, 224);
		this.passLabel.Name = "passLabel";
		this.passLabel.Size = new System.Drawing.Size(29, 12);
		this.passLabel.TabIndex = 11;
		this.passLabel.Text = "pass";
		this.nameLabel.AutoSize = true;
		this.nameLabel.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.nameLabel.Location = new System.Drawing.Point(48, 197);
		this.nameLabel.Name = "nameLabel";
		this.nameLabel.Size = new System.Drawing.Size(29, 12);
		this.nameLabel.TabIndex = 9;
		this.nameLabel.Text = "name";
		this.nameTextBox.ImeMode = System.Windows.Forms.ImeMode.On;
		this.nameTextBox.Location = new System.Drawing.Point(141, 194);
		this.nameTextBox.Name = "nameTextBox";
		this.nameTextBox.Size = new System.Drawing.Size(157, 21);
		this.nameTextBox.TabIndex = 10;
		this.nameTextBox.Text = "user";
		this.passTextBox.Location = new System.Drawing.Point(141, 221);
		this.passTextBox.Name = "passTextBox";
		this.passTextBox.PasswordChar = '*';
		this.passTextBox.Size = new System.Drawing.Size(157, 21);
		this.passTextBox.TabIndex = 12;
		this.Login_CheckBox.AutoSize = true;
		this.Login_CheckBox.Location = new System.Drawing.Point(12, 168);
		this.Login_CheckBox.Name = "Login_CheckBox";
		this.Login_CheckBox.Size = new System.Drawing.Size(156, 16);
		this.Login_CheckBox.TabIndex = 1;
		this.Login_CheckBox.Text = "oSpecify Login Account";
		this.Login_CheckBox.UseVisualStyleBackColor = true;
		this.Login_CheckBox.CheckedChanged += new System.EventHandler(Login_CheckBox_CheckedChanged);
		this.CloseTray_CheckBox.AutoSize = true;
		this.CloseTray_CheckBox.Location = new System.Drawing.Point(12, 146);
		this.CloseTray_CheckBox.Name = "CloseTray_CheckBox";
		this.CloseTray_CheckBox.Size = new System.Drawing.Size(210, 16);
		this.CloseTray_CheckBox.TabIndex = 1;
		this.CloseTray_CheckBox.Text = "oHide to System Tray when close";
		this.CloseTray_CheckBox.UseVisualStyleBackColor = true;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(364, 305);
		base.Controls.Add(this.passLabel);
		base.Controls.Add(this.nameLabel);
		base.Controls.Add(this.nameTextBox);
		base.Controls.Add(this.passTextBox);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.Login_CheckBox);
		base.Controls.Add(this.CloseTray_CheckBox);
		base.Controls.Add(this.SystemTray_CheckBox);
		base.Controls.Add(this.ExcelFile_RadioButton);
		base.Controls.Add(this.CustomFile_RadioButton);
		base.Controls.Add(this.Normal_RadioButton);
		base.Controls.Add(this.Disable_RadioButton);
		base.Name = "StartUpForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
		this.Text = "StartUpForm";
		base.Load += new System.EventHandler(StartUpForm_Load);
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public StartUpForm(string ctarget, bool cfix = false)
	{
		InitializeComponent();
		fix = cfix;
		target = ctarget;
	}

	private void StartUpForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_StartupConfig");
		Disable_RadioButton.Text = Program.GetLang("pw_Disable");
		Normal_RadioButton.Text = Program.GetLang("pw_NormalStartup");
		CustomFile_RadioButton.Text = Program.GetLang("pw_RunCustomFileInEthernet");
		ExcelFile_RadioButton.Text = Program.GetLang("pw_RunExcelCSVFileInEthernet");
		SystemTray_CheckBox.Text = Program.GetLang("pw_MinimizetoSystemTray");
		Login_CheckBox.Text = Program.GetLang("pw_SpecifyLoginAccount");
		nameLabel.Text = Program.GetLang("pw_User");
		passLabel.Text = Program.GetLang("pw_Password");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		okButton.Text = Program.GetLang("pw_OK");
		CloseTray_CheckBox.Text = Program.GetLang("pw_HideToSystemTrayWhenClose");
		if (target != null)
		{
			string[] array = target.Split(' ');
			for (int i = 0; i < array.Length; i++)
			{
				if (array[i].Length >= 3 && array[i].Substring(0, 3) == "-L|")
				{
					string[] array2 = array[i].Split('|');
					if (array2.Length >= 3)
					{
						nameTextBox.Text = array2[1];
						passTextBox.Text = array2[2];
						Login_CheckBox.Checked = true;
					}
				}
				else if (array[i] == "-A2A")
				{
					CustomFile_RadioButton.Checked = true;
				}
				else if (array[i] == "-A3A")
				{
					ExcelFile_RadioButton.Checked = true;
				}
				else if (array[i] == "-SystemTray")
				{
					SystemTray_CheckBox.Checked = true;
				}
			}
		}
		else
		{
			Disable_RadioButton.Checked = true;
			SystemTray_CheckBox.Checked = false;
		}
		if (fix && !Disable_RadioButton.Checked)
		{
			RadioButton disable_RadioButton = Disable_RadioButton;
			bool enabled = (Login_CheckBox.Enabled = false);
			disable_RadioButton.Enabled = enabled;
			CustomFile_RadioButton.Enabled = CustomFile_RadioButton.Checked;
			ExcelFile_RadioButton.Enabled = ExcelFile_RadioButton.Checked;
			Normal_RadioButton.Enabled = Normal_RadioButton.Checked;
		}
		Login_CheckBox_CheckedChanged(null, null);
		Disable_RadioButton_CheckedChanged(null, null);
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		string text;
		if (Disable_RadioButton.Checked)
		{
			text = null;
		}
		else
		{
			text = (Login_CheckBox.Checked ? ("-L|" + nameTextBox.Text + "|" + passTextBox.Text) : "-L");
			if (CustomFile_RadioButton.Checked)
			{
				text += " -A2A";
			}
			else if (ExcelFile_RadioButton.Checked)
			{
				text += " -A3A";
			}
			if (SystemTray_CheckBox.Checked)
			{
				text += " -SystemTray";
			}
		}
		Program.mf.SetStartup(text);
		Settings.Default.gen_CloseTray = CloseTray_CheckBox.Checked;
		Settings.Default.Save();
	}

	private void Disable_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		CheckBox login_CheckBox = Login_CheckBox;
		bool enabled = (SystemTray_CheckBox.Enabled = !Disable_RadioButton.Checked);
		login_CheckBox.Enabled = enabled;
		if (Disable_RadioButton.Checked)
		{
			CloseTray_CheckBox.Enabled = true;
			CloseTray_CheckBox.Checked = false;
		}
		else
		{
			CloseTray_CheckBox.Enabled = false;
			CloseTray_CheckBox.Checked = true;
		}
	}

	private void Login_CheckBox_CheckedChanged(object sender, EventArgs e)
	{
		TextBox textBox = nameTextBox;
		bool enabled = (passTextBox.Enabled = Login_CheckBox.Checked);
		textBox.Enabled = enabled;
	}
}
