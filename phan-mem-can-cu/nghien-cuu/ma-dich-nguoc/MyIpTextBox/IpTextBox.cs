using System;
using System.ComponentModel;
using System.Drawing;
using System.Text.RegularExpressions;
using System.Windows.Forms;

namespace MyIpTextBox;

public class IpTextBox : UserControl
{
	private Regex drg = new Regex("\\d");

	private Color Bordercolor = Color.Black;

	private string iptext = "0.0.0.0";

	private int ip1;

	private int ip2;

	private int ip3;

	private int ip4;

	private IContainer components;

	private TextBox textBox1;

	private TextBox textBox2;

	private TextBox textBox3;

	private TextBox textBox4;

	[Description("设置边框颜色")]
	[DefaultValue(typeof(Color), "Black")]
	public Color BorderColor
	{
		get
		{
			return Bordercolor;
		}
		set
		{
			Bordercolor = value;
		}
	}

	[Description("IP值")]
	public string IpText
	{
		get
		{
			return iptext;
		}
		set
		{
			if (value.Split('.').Length != 4)
			{
				MessageBox.Show("无效属性值", "警告");
				return;
			}
			string[] array = value.Split('.');
			ip1 = short.Parse(array[0]);
			ip2 = short.Parse(array[1]);
			ip3 = short.Parse(array[2]);
			ip4 = short.Parse(array[3]);
			textBox1.Text = array[0];
			textBox2.Text = array[1];
			textBox3.Text = array[2];
			textBox4.Text = array[3];
			iptext = value;
		}
	}

	public int IP1
	{
		get
		{
			return ip1;
		}
		set
		{
			if (value >= 0 && value < 256)
			{
				ip1 = value;
				textBox1.Text = ip1.ToString();
				iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
			}
		}
	}

	public int IP2
	{
		get
		{
			return ip2;
		}
		set
		{
			if (value >= 0 && value < 256)
			{
				ip2 = value;
				textBox2.Text = ip2.ToString();
				iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
			}
		}
	}

	public int IP3
	{
		get
		{
			return ip3;
		}
		set
		{
			if (value >= 0 && value < 256)
			{
				ip3 = value;
				textBox3.Text = ip3.ToString();
				iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
			}
		}
	}

	public int IP4
	{
		get
		{
			return ip4;
		}
		set
		{
			if (value >= 0 && value < 256)
			{
				ip4 = value;
				textBox4.Text = ip4.ToString();
				iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
			}
		}
	}

	public IpTextBox()
	{
		InitializeComponent();
		textBox1.Text = "0";
		textBox2.Text = "0";
		textBox3.Text = "0";
		textBox4.Text = "0";
	}

	private void textBox1_TextChanged(object sender, EventArgs e)
	{
		if (textBox1.Text.Length == 3)
		{
			textBox2.Focus();
			textBox2.Select(0, textBox2.Text.Length);
		}
		if (textBox1.Text != "" && int.Parse(textBox1.Text) > 255)
		{
			textBox1.Text = "255";
		}
		ip1 = short.Parse((textBox1.Text == "") ? "0" : textBox1.Text);
		iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
	}

	private void textBox2_TextChanged(object sender, EventArgs e)
	{
		if (textBox2.Text.Length == 3)
		{
			textBox3.Focus();
			textBox3.Select(0, textBox3.Text.Length);
		}
		if (textBox2.Text != "" && int.Parse(textBox2.Text) > 255)
		{
			textBox2.Text = "255";
		}
		ip2 = short.Parse((textBox2.Text == "") ? "0" : textBox2.Text);
		iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
	}

	private void textBox3_TextChanged(object sender, EventArgs e)
	{
		if (textBox3.Text.Length == 3)
		{
			textBox4.Focus();
			textBox4.Select(0, textBox4.Text.Length);
		}
		if (textBox3.Text != "" && int.Parse(textBox3.Text) > 255)
		{
			textBox3.Text = "255";
		}
		ip3 = short.Parse((textBox3.Text == "") ? "0" : textBox3.Text);
		iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
	}

	private void textBox4_TextChanged(object sender, EventArgs e)
	{
		if (textBox4.Text != "" && int.Parse(textBox4.Text) > 255)
		{
			textBox4.Text = "255";
		}
		ip4 = short.Parse((textBox4.Text == "") ? "0" : textBox4.Text);
		iptext = ip1 + "." + ip2 + "." + ip3 + "." + ip4;
	}

	private void textBox1_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\b')
		{
			if (textBox1.Text.Length == 0)
			{
				textBox1.Text = "0";
			}
		}
		else if (e.KeyChar == '.')
		{
			e.KeyChar = '\0';
			textBox2.Focus();
			textBox2.SelectionStart = textBox2.Text.Length;
		}
		else if (!drg.IsMatch(e.KeyChar.ToString()))
		{
			e.KeyChar = '\0';
		}
	}

	private void textBox2_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\b')
		{
			if (textBox2.Text.Length == 0)
			{
				textBox2.Text = "0";
				textBox1.Focus();
				textBox1.SelectionStart = textBox1.Text.Length;
			}
		}
		else if (e.KeyChar == '.')
		{
			textBox3.Focus();
			e.KeyChar = '\0';
		}
		else if (!drg.IsMatch(e.KeyChar.ToString()))
		{
			e.KeyChar = '\0';
		}
	}

	private void textBox3_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\b')
		{
			if (textBox3.Text.Length == 0)
			{
				textBox3.Text = "0";
				textBox2.Focus();
				textBox2.SelectionStart = textBox2.Text.Length;
			}
		}
		else if (e.KeyChar == '.')
		{
			textBox4.Focus();
			e.KeyChar = '\0';
		}
		else if (!drg.IsMatch(e.KeyChar.ToString()))
		{
			e.KeyChar = '\0';
		}
	}

	private void textBox4_KeyPress(object sender, KeyPressEventArgs e)
	{
		if (e.KeyChar == '\b')
		{
			if (textBox4.Text.Length == 0)
			{
				textBox4.Text = "0";
				textBox3.Focus();
				textBox3.SelectionStart = textBox3.Text.Length;
			}
		}
		else if (!drg.IsMatch(e.KeyChar.ToString()))
		{
			e.KeyChar = '\0';
		}
	}

	protected override void OnPaint(PaintEventArgs e)
	{
		Graphics graphics = CreateGraphics();
		Pen pen = new Pen(Bordercolor, 1f);
		graphics.DrawRectangle(pen, 0, 0, 122, 22);
		graphics.DrawArc(pen, 30, 12, 1, 1, 45, 270);
		graphics.DrawArc(pen, 61, 12, 1, 1, 45, 270);
		graphics.DrawArc(pen, 92, 12, 1, 1, 45, 270);
		base.OnPaint(e);
	}

	private void textBox1_Leave(object sender, EventArgs e)
	{
		if (textBox1.Text == "")
		{
			textBox1.Text = "0";
		}
	}

	private void textBox2_Leave(object sender, EventArgs e)
	{
		if (textBox2.Text == "")
		{
			textBox2.Text = "0";
		}
	}

	private void textBox3_Leave(object sender, EventArgs e)
	{
		if (textBox3.Text == "")
		{
			textBox3.Text = "0";
		}
	}

	private void textBox4_Leave(object sender, EventArgs e)
	{
		if (textBox4.Text == "")
		{
			textBox4.Text = "0";
		}
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
		this.textBox1 = new System.Windows.Forms.TextBox();
		this.textBox2 = new System.Windows.Forms.TextBox();
		this.textBox3 = new System.Windows.Forms.TextBox();
		this.textBox4 = new System.Windows.Forms.TextBox();
		base.SuspendLayout();
		this.textBox1.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.textBox1.Location = new System.Drawing.Point(4, 4);
		this.textBox1.MaxLength = 3;
		this.textBox1.Name = "textBox1";
		this.textBox1.Size = new System.Drawing.Size(21, 14);
		this.textBox1.TabIndex = 0;
		this.textBox1.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
		this.textBox1.TextChanged += new System.EventHandler(textBox1_TextChanged);
		this.textBox1.Leave += new System.EventHandler(textBox1_Leave);
		this.textBox1.KeyPress += new System.Windows.Forms.KeyPressEventHandler(textBox1_KeyPress);
		this.textBox2.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.textBox2.Location = new System.Drawing.Point(35, 4);
		this.textBox2.MaxLength = 3;
		this.textBox2.Name = "textBox2";
		this.textBox2.Size = new System.Drawing.Size(21, 14);
		this.textBox2.TabIndex = 1;
		this.textBox2.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
		this.textBox2.TextChanged += new System.EventHandler(textBox2_TextChanged);
		this.textBox2.Leave += new System.EventHandler(textBox2_Leave);
		this.textBox2.KeyPress += new System.Windows.Forms.KeyPressEventHandler(textBox2_KeyPress);
		this.textBox3.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.textBox3.Location = new System.Drawing.Point(66, 4);
		this.textBox3.MaxLength = 3;
		this.textBox3.Name = "textBox3";
		this.textBox3.Size = new System.Drawing.Size(21, 14);
		this.textBox3.TabIndex = 2;
		this.textBox3.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
		this.textBox3.TextChanged += new System.EventHandler(textBox3_TextChanged);
		this.textBox3.Leave += new System.EventHandler(textBox3_Leave);
		this.textBox3.KeyPress += new System.Windows.Forms.KeyPressEventHandler(textBox3_KeyPress);
		this.textBox4.BorderStyle = System.Windows.Forms.BorderStyle.None;
		this.textBox4.Location = new System.Drawing.Point(97, 4);
		this.textBox4.MaxLength = 3;
		this.textBox4.Name = "textBox4";
		this.textBox4.Size = new System.Drawing.Size(21, 14);
		this.textBox4.TabIndex = 3;
		this.textBox4.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
		this.textBox4.TextChanged += new System.EventHandler(textBox4_TextChanged);
		this.textBox4.Leave += new System.EventHandler(textBox4_Leave);
		this.textBox4.KeyPress += new System.Windows.Forms.KeyPressEventHandler(textBox4_KeyPress);
		this.BackColor = System.Drawing.SystemColors.ControlLightLight;
		base.Controls.Add(this.textBox4);
		base.Controls.Add(this.textBox3);
		base.Controls.Add(this.textBox2);
		base.Controls.Add(this.textBox1);
		base.Name = "IpTextBox";
		base.Size = new System.Drawing.Size(123, 23);
		base.ResumeLayout(false);
		base.PerformLayout();
	}
}
